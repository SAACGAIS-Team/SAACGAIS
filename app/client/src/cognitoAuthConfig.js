export const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-2.amazonaws.com/us-east-2_c7YjbXCu3",
  client_id: "7lua5mn5k5i6cffirttl5qa5b",
  redirect_uri: "http://localhost:3000/callback",    
  post_logout_redirect_uri: "http://localhost:3000/",  
  response_type: "code",
  scope: "email profile openid phone",
};

