import AWS from "aws-sdk";

const sqs = new AWS.SQS({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
  });

const params = {
    QueueUrl: process.env.AWS_SQS_URL,
};

// post data to aws sqs
export const pushDataToAwsSqs = async (sqsMessageObject)=>{
    await sqs.sendMessage({
        ...params,
        MessageBody: JSON.stringify(sqsMessageObject),
    }).promise();
}