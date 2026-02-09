const jwt = require("jsonwebtoken");

const authMiddleware = (req, resp, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer "))
    {
        return resp.status(401).json({message: "unauthorized"});
    }

    const token = authHeader.split(" ")[1];

    if(!token)
    {
        return resp.status(401).json({message: "Un_Authorized"});
    }

    try{
        const decodedUser = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decodedUser;
        next();
    }
    catch(error)
    {
        return resp.status(401).json({message: "Invalid Token"});
    }
};

module.exports = authMiddleware;
