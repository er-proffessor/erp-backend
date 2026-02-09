
const superAdminOnly = (req, resp) => {
    resp.json({message: "Welcome Super Admin"});
}

const clientOnly = (req, resp) => {
    resp.json({message: "Welcome Client"});
}

module.exports = {superAdminOnly, clientOnly};


