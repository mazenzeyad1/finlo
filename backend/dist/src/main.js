"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bodyParser = require("body-parser");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    app.useLogger(['log', 'error', 'warn', 'debug']);
    const frontendUrl = config.get('APP_URL') ?? 'http://localhost:4200';
    const corsOrigins = config.get('CORS_ORIGINS');
    const originList = (corsOrigins ? corsOrigins.split(',') : [])
        .map((origin) => origin.trim())
        .filter((origin) => Boolean(origin));
    const uniqueOrigins = Array.from(new Set([...originList, frontendUrl])).filter(Boolean);
    app.enableCors({
        origin: uniqueOrigins,
        credentials: true,
    });
    app.use(bodyParser.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
    app.use(bodyParser.urlencoded({ extended: true, verify: (req, _res, buf) => { req.rawBody = buf; } }));
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT || 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map