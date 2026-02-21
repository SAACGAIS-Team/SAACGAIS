// Authorization Middleware ( req.authz builder )
/*
  Purpose: 
     Build a consistent authoziation context from: 

     - identity ( from JWT token ) WHO 
     - action/ resource: backend metadata    WHAT 
     - target: request -derived object idnetifier      WHICH


  Output:
   req.authz = {
     identity: { sub: string, roles: string[] },
     action: string,
     resource: string,
     target: object | string | null
    }


    * action/ resources are trusted since they are difined by the backend 
      target will be untrusted becuase it comes fromt he request 
      OPA will allow/deny based on these information stored in req.authz

*/


const jwt = require("jsonwebtoken"); 

function authzMiddleware(action, resource, getTarget = () => null)
{
  return function(req, res, next)
  {
    // Removes the "Bearer " and checks if the token exists
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(403).send("Token does not exist");
    }

    // Error Handling for verfication of the JWT token 
    let decoded;
    try{
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err)
    {
      console.log("Token is invalid");
      return res.status(403).send("Invalid Token");
    }

    // Extracted data from the JWT token 
    const userId = decoded.sub;
    const roles = decoded.roles || []; 

    const target = getTarget(req);
  


    req.authz = 
    {
      "identity": {
        "sub": userId,
        "roles": roles
      },
      "action": action, 
      "resource": resource , 
      "target": target
    }

    next()

  };
}

module.exports = authzMiddleware;