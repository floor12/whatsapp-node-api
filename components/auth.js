const router = require('express').Router();
const fs = require('fs');

router.get('/checkauth', async (req, res) => {
    client.getState().then((data) => {
        console.log(data)
        res.send(data)
    }).catch((err) => {
        if (err) {
            res.send("DISCONNECTED")
            try {
                fs.unlinkSync('/app/runtime/session.json')
            } catch (err) {
                console.log(err)
            }
        }
    })
});

router.post('/logout', async (req, res) => {
    try {
        fs.unlinkSync('/app/runtime/session.json')
        res.send("DISCONNECTED")
    } catch (err) {
        console.log(err)
    }
});

router.get('/getqr', (req, res) => {
    var qrjs = fs.readFileSync('components/qrcode.js');

    fs.readFile('/app/runtime/last.qr', (err, last_qr) => {
        fs.readFile('/app/runtime/session.json', (serr, sessiondata) => {
            if (err && sessiondata) {
                res.write("<html><body><h2>Already Authenticated</h2></body></html>");
                res.end();
            } else if (!err && serr) {
                var page = `
                    <html>
                        <body>
                            <script>${qrjs}</script>
                            <div id="qrcode"></div>
                            <script type="text/javascript">
                                new QRCode(document.getElementById("qrcode"), "${last_qr}");
                            </script>
                        </body>
                    </html>
                `
                res.write(page)
                res.end();
            }
        })
    });
});

module.exports = router;