import * as Joi from 'joi';

export function validateEnv(config: Record<string, unknown>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3001),
    DATABASE_URL_APP: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),
  }).unknown(true);

  const { error, value } = schema.validate(config);
  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }
  return value;
}
