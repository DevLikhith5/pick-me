"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const http_status_codes_1 = require("http-status-codes");
const validate = (schemas) => (req, res, next) => {
    try {
        //if there is only zodSchema
        if ('parse' in schemas) {
            schemas.parse(req.body);
        }
        else {
            if (schemas.body)
                schemas.body.parse(req.body);
            if (schemas.params)
                schemas.params.parse(req.params);
            if (schemas.query)
                schemas.query.parse(req.query);
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Validation Error",
                errors: error.errors,
            });
            return;
        }
        //will go to generic error
        next(error);
    }
};
exports.validate = validate;
