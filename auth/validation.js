const Joi = require('@hapi/joi');

const authSchema = Joi.object({
    username: Joi.string().min(8).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(255).required(),
})

module.exports = {
    authSchema
}