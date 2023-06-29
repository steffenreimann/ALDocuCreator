const path = require('path');
const fs = require('fs');
const readline = require('readline');

var pathToProject = "C:/repos/DW API Wrapper for BC/src/"
var lines = 0;
var test = {}

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isDirectory());
}

function getFiles(srcpath) {
    return fs.readdirSync(srcpath)
        .map(file => path.join(srcpath, file))
        .filter(path => fs.statSync(path).isFile());
}

async function init() {

    var startTime = new Date()
    var dirs = getDirectories(pathToProject)

    for await (const dir of dirs) {

        var parsedDir = path.parse(dir)
        var files = getFiles(dir)
        test[parsedDir.name] = {}

        for await (const file of files) {

            var parsedFile = path.parse(file)
            test[parsedDir.name][parsedFile.name] = await extractCommentsFromFile(file)

        }
    }
    var endTime = new Date()

    console.log(test);
    console.log(lines, 'Zeilen in', endTime - startTime, 'ms');

}

async function extractCommentsFromFile(filePath) {
    return new Promise((resolve, reject) => {

        //const comments = {};

        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity
        });

        let currentVariable = null;
        let commentLines = [];

        let startContent = ''
        let content = ''
        let endContent = ''
        let blockStated = false
        let blockEnded = false
        var params = {}
        var lol = {}

        rl.on('line', (line) => {
            lines++
            line = line.trim()

            if (line[0] == '/' && line[1] == '/' && line[2] == '/') {

                if (line.match(/.*<\/.*>/)) {

                    if (line.match(/.*<.*>/) && line.match(/.*<[^/]*>/)) {
                        if (!blockStated) {
                            blockStated = true
                        }

                    } else {

                        line = line.replace('<', '')
                        line = line.replace('>', '')
                        line = line.replace('/', '')
                        line = line.replace('/', '')
                        line = line.replace('/', '')
                        line = line.replace('/', '')
                        line = line.trim()
                        endContent = line
                    }

                } else if (line.match(/.*<.*>/)) {
                    if (!blockStated) {
                        blockStated = true
                    }

                    line = line.replace('<', '')
                    line = line.replace('>', '')
                    line = line.replace('/', '')
                    line = line.replace('/', '')
                    line = line.replace('/', '')
                    line = line.trim()
                    startContent = line


                    paramName = ''
                    paramValue = ''
                    paramNameStartIndex = 0
                    paramNameEndIndex = 0

                    paramValueStartIndex = 0
                    paramValueEndIndex = 0

                    paramNameStartIndex = line.search(' ')
                    paramNameEndIndex = line.search('=')

                    if (paramNameStartIndex != -1 && paramNameEndIndex != -1) {
                        startContent = line.slice(0, paramNameStartIndex).trim()
                    }

                    while (paramNameStartIndex != -1 && paramNameEndIndex != -1) {

                        paramName = line.slice(paramNameStartIndex, paramNameEndIndex).trim()

                        line = line.slice(paramNameEndIndex);
                        paramValueStartIndex = line.search('"')
                        currline = line.slice(paramValueStartIndex + 1);
                        paramValueEndIndex = currline.search('"')
                        currline = currline.slice(0, paramValueEndIndex);
                        params[paramName] = currline

                        paramNameStartIndex = line.search(' ')
                        paramNameEndIndex = line.search('=')
                    }

                } else if (blockStated) {

                    line = line.replace('/', '')
                    line = line.replace('/', '')
                    line = line.replace('/', '')
                    line = line.trim()
                    content = line
                    //console.log('This Line with content', line.trim());
                }

            } else if (line != '') {
                if (blockStated) {
                    blockEnded = true
                    blockStated = false
                    if (blockEnded) {

                        lol[startContent] = { content: content, params: params }
                    }
                }
            }


        });

        rl.on('close', () => {
            //console.log(test);
            resolve(lol)
            // Here you can do whatever you want with the 'comments' object
        });
    });
}

init()
