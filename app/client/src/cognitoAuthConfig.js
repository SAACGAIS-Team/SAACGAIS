export const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_syjjXolri",
  client_id: "7iemor0v7h4aksq8q896v74njm",
  redirect_uri: "http://localhost:3000/callback",    
  post_logout_redirect_uri: "http://localhost:3000/",  
  response_type: "code",
  scope: "email openid phone profile",
};

