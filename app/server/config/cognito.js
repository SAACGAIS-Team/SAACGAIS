import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_COGNITO_REGION,
  accessKeyId: process.env.AWS_BACKEND_KEY,
  secretAccessKey: process.env.AWS_BACKEND_SECRET,
});

export const cognito = new AWS.CognitoIdentityServiceProvider();
export const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;
