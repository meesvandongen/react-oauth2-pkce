import { createMiddleware } from "@mswjs/http-middleware";
import cors from "cors";
import express from "express";
import { createOidcHandlers } from "./handlers";
import { MockOidcProvider } from "./mockOidcProvider";

const provider = new MockOidcProvider();

const app = express();

app.use(cors());

app.use(createMiddleware(...createOidcHandlers(provider)));

app.listen(5556);
