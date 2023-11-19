require('dotenv').config();

const { fromEnv } = require('@aws-sdk/credential-providers');
const { Op } = require('sequelize');
const { SQSClient, SendMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

const s3Functions = require('../s3/s3Functions');
const { Form } = require('../../../models');

const REQUEUE_DELAY = 30; // in seconds
const REQUEUE_MAX_ATTEMPTS = 5;

const {
  AWS_ACCOUNT_NUMBER,
  AWS_QUEUE_NAME,
  AWS_REGION,
} = process.env;

const queueURL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_NUMBER}/${AWS_QUEUE_NAME}`;
console.log('queueURL:', queueURL);

const sqsClient = new SQSClient({
  region: AWS_REGION,
  credentials: fromEnv(),
});

const processMessage = async (mes) => {
  console.log('Processing message: ', mes.Body);
  console.log('Receipt handle: ', mes.ReceiptHandle);

  // const parsedBody = JSON.parse(mes.Body);
  // const parsedMessageContent = JSON.parse(parsedBody.Message);

  let parsedBody;
  try {
    parsedBody = JSON.parse(mes.Body);
  } catch (e) {
    console.error('Error parsing message body:', mes.Body, e);
    return; // Stop processing if the body can't be parsed
  }
  console.log('parsedBody', parsedBody);

  // Check if parsedBody.Message exists and is a string
  if (typeof parsedBody.Message !== 'string') {
    console.error('parsedBody.Message is not a string:', parsedBody.Message);
    return; // Stop processing if Message is not a string
  }

  let parsedMessageContent;
  try {
    parsedMessageContent = JSON.parse(parsedBody.Message);
  } catch (e) {
    console.error('Error parsing parsedBody.Message:', parsedBody.Message, e);
    return; // Stop processing if the message content can't be parsed
  }

  parsedMessageContent.AttemptCount = (parsedMessageContent.AttemptCount || 0) + 1;

  // NOTE AWS textract is limited in how it can be structured, so "JobId" is "textractJobId"
  const {
    JobId: textractJobId,
    Status: status,
    FormId: formId,
  } = parsedMessageContent;

  switch (status) {
    case 'ANALYZING': {
      console.log(`Form ${formId} is being analyzed on textract.`);

      const [updatedRows] = await Form.update(
        {
          status: 'analyzing',
          textractJobId,
          analysisFolderNameS3: `analysis/${textractJobId}`,
        },
        {
          where: {
            id: formId,
          },
        }
      );
      if (updatedRows === 0) {
        console.warn(`Form ${formId} was not set to 'analyzing'.`);
      }
      break;
    }

    case 'FAILED': {
      console.log(`Form ${formId} encountered an error.`);

      const [updatedRows] = await Form.update(
        {
          status: 'error',
          textractJobId,
        },
        {
          where: {
            id: formId,
          },
        }
      );
      if (updatedRows === 0) {
        console.warn(`Form ${formId} was not set to 'error'.`);
      }
      break;
    }

    // 'SUCCEEDED' in AWS Textract denotes a completed analysis.
    case 'SUCCEEDED': {
      console.log(`Form with textractJobId ${textractJobId} has completed the textract process.`);

      // Find the form with the given textractJobId
      const form = await Form.findOne({
        where: { textractJobId },
      });

      if (!form) {
        if (parsedMessageContent.AttemptCount <= REQUEUE_MAX_ATTEMPTS) {
          await requeueMessage(mes.ReceiptHandle, parsedMessageContent);
          console.warn(`Requeued message for textractJobId ${textractJobId}. Attempt count: ${parsedMessageContent.AttemptCount}`);
        } else {
          console.error(`Max retries reached for message: ${mes.MessageId}`);
          // Handle max retries (e.g., log, move to DLQ)
        }
        break;
      }

      // Extract the analysisFolderNameS3
      const { analysisFolderNameS3 } = form;

      // Extract various information about the analysis
      const {
        pageCount,
        textractKeyValues,
      } = await s3Functions.getAnalysis(analysisFolderNameS3);

      // Update the form
      form.pages = pageCount;
      form.status = 'ready';
      form.textractKeyValues = textractKeyValues;
      await form.save();

      console.log(`Form with textractJobId ${textractJobId} has been set to 'ready'.`);
      break;
    }

    default: {
      console.log(`No matching action for status ${status}`);
    }
  }

  async function requeueMessage(receiptHandle, msgContent) {
    const newMsgContent = {
      ...msgContent,
      AttemptCount: (msgContent.AttemptCount) + 1, // use TitleCase here to match AWS
    };

    console.log('newMsgContent', newMsgContent);

    // Prepare new message parameters
    const backoffDelaySeconds = REQUEUE_DELAY * (newMsgContent.AttemptCount);
    const sendMessageParams = {
      QueueUrl: queueURL,
      MessageBody: JSON.stringify(newMsgContent),
      DelaySeconds: backoffDelaySeconds,
    };

    try {
      // Send the new message
      await sqsClient.send(new SendMessageCommand(sendMessageParams));
      console.log('Message re-queued successfully');

      // Delete the original message
      const deleteMessageParams = {
        QueueUrl: queueURL,
        ReceiptHandle: receiptHandle,
      };
      await sqsClient.send(new DeleteMessageCommand(deleteMessageParams));
      console.log('Original message deleted successfully');
    } catch (error) {
      console.error('Error in re-queuing the message:', error);
    }
  }
};

module.exports = {
  processMessage,
};
