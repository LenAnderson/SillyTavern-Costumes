import { jsonParser } from '../../src/express-common.js';
import { createRequire } from 'module';
const require  = createRequire(import.meta.url);
const path = require('path');
const { DIRECTORIES } = require('../../src/constants.js');
const sanitize = require('sanitize-filename');
const fs = require('fs');

const listDirsRecurse = (directoryPath, recurse=true)=>{
    const out = [];
    const items = fs.readdirSync(directoryPath);
    for (const item of items) {
        if (!fs.lstatSync(path.join(directoryPath, item)).isDirectory()) continue;
        out.push(path.join(directoryPath, item));
        if (recurse) out.push(...listDirsRecurse(path.join(directoryPath, item)));
    }
    return out;
};

export async function init(router) {
    router.post('/', jsonParser, (req, res) => {
        console.log('[Costumes]', '/', req.body);
        const directoryPath = path.join(process.cwd(), DIRECTORIES.characters, ...(req.body.folder?.split('/') ?? []).map(it=>sanitize(it)));

        const result = [];
        if (!fs.existsSync(directoryPath)) {
            return res.send([]);
        } else {
            try {
                const images = [directoryPath, ...listDirsRecurse(directoryPath, req.body.recurse ?? true)];
                const cut = path.join(process.cwd(), DIRECTORIES.characters).length;
                return res.send(images.map(it=>it.slice(cut).replace('\\', '/')));
            } catch (error) {
                console.error(error);
                return res.status(500).send({ error: 'Unable to retrieve files' });
            }
        }
    });
}

export async function exit() {}

const module = {
	init,
	exit,
	info: {
		id: 'costumes',
		name: 'Costumes',
		description: 'Provides and endpoint to retrieve a list of costume / sprite folders.',
	},
};
export default module;
