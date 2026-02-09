const roleMiddleware = (...allowedRoles) => {
  
    // console.log("User_Role:", req,user.role);
    // console.log("Allowed_Role:", roles);

    return (req, resp, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role))
        {
            return resp.status(403).json({message: "Access Denied"});
        }
        next();

    };
};

module.exports = roleMiddleware;
