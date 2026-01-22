import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

AWS.config.update({
  region: process.env.AWS_COGNITO_REGION,
  accessKeyId: process.env.AWS_COGNITO_KEY,
  secretAccessKey: process.env.AWS_COGNITO_SECRET,
});

export const cognito = new AWS.CognitoIdentityServiceProvider();
export const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;
