const express = require('express');
const cors = require('cors');
const { ubuntuRepositorySearch, githubRepositorySearch } = require('./utils');

const app = express();
const port = 7563;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('public/index.html');
})

app.post('/search', async (req, res) => {
    const { query } = req.body;
    const pkgURL = await ubuntuRepositorySearch(query);
    const githubAssets = await githubRepositorySearch(query);

    if (!pkgURL && githubAssets.length === 0) {
        res.json({
            success: false,
        });
    } else {
        res.json({
            success: true,
            ubuntuURL: pkgURL,
            githubAssets: githubAssets,
        });
    }
})

app.listen(port, () => {
    console.log(`Open http://localhost:${port}`);

})