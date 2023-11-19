require('dotenv').config();

const { fromEnv } = require('@aws-sdk/credential-providers');

const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const {
  AWS_ACCOUNT_NUMBER,
  AWS_REGION,
  AWS_SQS_QUEUE_NAME,
  AWS_SQS_REQUEUE_DELAY,
} = process.env;

const queueURL = `https://sqs.${AWS_REGION}.amazonaws.com/${AWS_ACCOUNT_NUMBER}/${AWS_SQS_QUEUE_NAME}`;

const sqsClient = new SQSClient({
  region: AWS_REGION,
  credentials: fromEnv(),
});

const sqsFunctions = {};

sqsFunctions.requeueMessage = async (messageJSON, retryCount) => {
  const newRetryCount = retryCount + 1;
  console.log('newRetryCount', newRetryCount);

  // NOTE sqsParams (and its messageJSON) are aimed to match structure of textract's JSON output.
  // This simplifies the message processor logic when messages are polled from the SQS queue.
  const sqsMessageBodyJSON = JSON.stringify({
    Type: 'Notification',
    Message: messageJSON,
    RetryCount: newRetryCount,
  });

  const backoffDelaySeconds = AWS_SQS_REQUEUE_DELAY * newRetryCount;
  console.log('backoffDelaySeconds', backoffDelaySeconds);

  const sendMessageParams = {
    DelaySeconds: backoffDelaySeconds,
    MessageBody: sqsMessageBodyJSON,
    QueueUrl: queueURL,
  };

  try {
    await sqsClient.send(new SendMessageCommand(sendMessageParams));
    console.log('Message requeued to SQS successfully');
  } catch (error) {
    console.error('Error requeuing message to SQS:', error);
  }
};

module.exports = sqsFunctions;
