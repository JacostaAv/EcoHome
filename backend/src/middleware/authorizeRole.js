const authorizeRole = (role) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                error: 'Usuario no autenticado'
            });
        }

        if (req.user.role !== role) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta operación'
            });
        }

        next();
    };
};

module.exports = authorizeRole;