/**
 * summaly
 * https://github.com/misskey-dev/summaly
 */
import { URL } from 'node:url';
import { got } from 'got';
import general from './general.js';
import { plugins as builtinPlugins } from './plugins/index.js';
import { DEFAULT_OPERATION_TIMEOUT, DEFAULT_RESPONSE_TIMEOUT, agent, setAgent } from './utils/got.js';
export * from './iplugin.js';
export const summalyDefaultOptions = {
    lang: null,
    followRedirects: true,
    plugins: [],
};
/**
 * Summarize an web page
 */
export const summaly = async (url, options) => {
    if (options?.agent)
        setAgent(options.agent);
    const opts = Object.assign(summalyDefaultOptions, options);
    const plugins = builtinPlugins.concat(opts.plugins || []);
    let actualUrl = url;
    if (opts.followRedirects) {
        // .catch(() => url)にすればいいけど、jestにtrace-redirectを食わせるのが面倒なのでtry-catch
        try {
            const timeout = opts.responseTimeout ?? DEFAULT_RESPONSE_TIMEOUT;
            const operationTimeout = opts.operationTimeout ?? DEFAULT_OPERATION_TIMEOUT;
            actualUrl = await got
                .head(url, {
                timeout: {
                    lookup: timeout,
                    connect: timeout,
                    secureConnect: timeout,
                    socket: timeout, // read timeout
                    response: timeout,
                    send: timeout,
                    request: operationTimeout, // whole operation timeout
                },
                agent,
                http2: false,
                retry: {
                    limit: 0,
                },
            })
                .then(res => res.url);
        }
        catch (e) {
            actualUrl = url;
        }
    }
    const _url = new URL(actualUrl);
    // Find matching plugin
    const match = plugins.filter(plugin => plugin.test(_url))[0];
    // Get summary
    const scrapingOptions = {
        lang: opts.lang,
        userAgent: opts.userAgent,
        responseTimeout: opts.responseTimeout,
        operationTimeout: opts.operationTimeout,
        contentLengthLimit: opts.contentLengthLimit,
        contentLengthRequired: opts.contentLengthRequired,
    };
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const summary = await (match ? match.summarize : general)(_url, scrapingOptions);
    if (summary == null) {
        throw new Error('failed summarize');
    }
    return Object.assign(summary, {
        url: actualUrl,
    });
};
// noinspection JSUnusedGlobalSymbols
export default function (fastify, options, done) {
    fastify.get('/', async (req, reply) => {
        const url = req.query.url;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (url == null) {
            return reply.status(400).send({
                error: 'url is required',
            });
        }
        try {
            return await summaly(url, {
                lang: req.query.lang,
                followRedirects: false,
                ...options,
            });
        }
        catch (e) {
            return reply.status(500).send({
                error: e,
            });
        }
    });
    done();
}
