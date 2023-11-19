const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { TextractClient, StartDocumentAnalysisCommand } = require("@aws-sdk/client-textract");

const sqsClient = new SQSClient({ region: process.env.REGION });
const s3Client = new S3Client({ region: process.env.REGION });
const textractClient = new TextractClient({ region: process.env.REGION });

module.exports.handler = async (event) => {
  const bucketName = event.Records[0].s3.bucket.name;
  const objectKey = event.Records[0].s3.object.key;

  // Retrieve object metadata
  const headObjectParams = {
    Bucket: bucketName,
    Key: objectKey,
  };
  let metadata;
  try {
    const headObjectOutput = await s3Client.send(new HeadObjectCommand(headObjectParams));
    metadata = headObjectOutput.Metadata;
  }
  catch (error) {
    // TODO notify SQS queue
    console.error('Error retrieving object metadata:', error);
    throw error;
  }

  console.log('bucketName', bucketName);
  console.log('objectKey', objectKey);
  console.log('metadata:', metadata);

  try {
    const startTextractParams = {
      DocumentLocation: {
        S3Object: {
          Bucket: bucketName,
          Name: objectKey,
        }
      },
      NotificationChannel: {
        RoleArn: process.env.TEXTRACT_TO_SNS_ROLE_ARN,
        SNSTopicArn: process.env.SNS_TOPIC_ARN,
      },
      FeatureTypes: [
        "FORMS",
        "LAYOUT",
        // "TABLES",
      ],
      OutputConfig: {
        S3Bucket: bucketName,
        S3Prefix: "analysis"
      }
    };

    const textractCommand = new StartDocumentAnalysisCommand(startTextractParams);
    console.log('Textract Command Params:', startTextractParams);

    // Starting the textract job before notifying 'ANALYZING' may create a race condition, however
    // the 'ANALYZING' message needs the textract job id so that it can be matched to later on.
    const textractResponse = await textractClient.send(textractCommand);
    console.log('Textract Response:', textractResponse);

    // NOTE sqsParams (and its messageJSON) are aimed to match structure of textract's JSON output.
    // This simplifies the message processor logic when messages are polled from the SQS queue.
    const messageJSON = JSON.stringify({
      JobId: textractResponse.JobId,
      Status: "ANALYZING",
      FormId: metadata.formid,
    })

    const sqsParams = {
      QueueUrl: process.env.SQS_TOPIC_URL,
      MessageBody: JSON.stringify({
        Type: "Notification",
        Message: messageJSON,
      }),
    };

    const sqsCommand = new SendMessageCommand(sqsParams);
    await sqsClient.send(sqsCommand);

  }
  catch (error) {
    // TODO notify SQS queue
    console.error('Error starting Textract job:', error);
    throw error;
  }
};
