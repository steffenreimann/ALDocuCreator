const path = require('path');
const fs = require('fs');
const readline = require('readline');

var p = "C:/repos/DW API Wrapper for BC/src/Codeunit/DWConnector.Codeunit.al"
var pathToProject = "C:/repos/DW API Wrapper for BC/src/"

var lastLineDocuComment = false;

var comments = []

class ProjectDocu {

}

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

var lines = 0;

var test = {}
async function init() {

    var startTime = new Date()
    var dirs = getDirectories(pathToProject)

    for await (const dir of dirs) {
        var parsedDir = path.parse(dir)
        var files = getFiles(dir)
        test[parsedDir.name] = {}
        for await (const file of files) {
            var parsedFile = path.parse(file)

            // console.log(parsedDir);
            //console.log(parsedDir.name, ' - ', parsedFile.name);
            //test[parsedDir.name][parsedFile.name] = extractCommentsToJSON(file)
            //test[parsedDir.name][parsedFile.name] = extractCommentsToJSON2(file)
            lol = await extractCommentsFromFile(file)
            //console.log(lol);
            test[parsedDir.name][parsedFile.name] = lol
            //test[parsedDir.name][parsedFile.name] = await processLineByLine(file)
        }
    }
    var endTime = new Date()

    console.log(test);
    console.log(lines, 'Zeilen in', endTime - startTime, 'ms');

}



var comments = {}

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

function extractCommentsToJSON2(filepath) {

    const alCode = fs.readFileSync(filepath,
        { encoding: 'utf8', flag: 'r' });

    const lines = alCode.split('\n');
    const json = [];

    let summary = '';
    let functionName = '';
    let params = '';
    let returns = '';
    let comment = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('/// <summary>')) {
            summary = line.substring('/// <summary>'.length, line.length - '</summary>'.length).trim();
        } else if (line.startsWith('local procedure') || line.startsWith('procedure')) {
            const match = line.match(/(?:local\s+)?procedure (\w+)\(([\s\S]*?)\)/);
            if (match) {
                functionName = match[1].trim();
                params = match[2].trim();
            }
        } else if (line.startsWith('/// <comment>')) {

            comment = line.substring('/// <comment>'.length, line.length - '</comment>'.length).trim();

        } else if (line.startsWith('/// <returns>')) {
            returns = line.substring('/// <returns>'.length, line.length - '</returns>'.length).trim();

            const returnTypeMatch = returns.match(/(?:Return (?:value of )?type|variable ReturnValue of type) ([^\.<]+(?:\.[^\.<]+)?)\.?/);
            if (returnTypeMatch) {
                returns = returnTypeMatch[1].trim();
            } else {
                returns = '';
            }

            const functionObj = {
                summary: functionName,
                params: {},
                returns: returns,
                comment: comment
            };

            if (params !== '') {
                const paramsArr = params.split(';');
                for (const param of paramsArr) {
                    const [paramName, paramType] = param.split(':').map(part => part.trim());
                    functionObj.params[paramName] = paramType;
                }
            }

            json.push(functionObj);

            // Zurücksetzen der Variablen für die nächste Funktion
            summary = '';
            functionName = '';
            params = '';
            returns = '';
            comment = '';
        }
    }

    return json;
}

function extractCommentsToJSON(filepath) {

    const alCode = fs.readFileSync(filepath,
        { encoding: 'utf8', flag: 'r' });

    const regex = /\/\/\/ <summary>([\s\S]*?)<\/summary>[\s\S]*?procedure (\w+)\(([\s\S]*?)\)[\s\S]*?<returns>([\s\S]*?)<\/returns>/g;
    const json = [];

    let match;
    while ((match = regex.exec(alCode))) {
        const summary = match[1].trim();
        const functionName = match[2];
        const paramsString = match[3].trim();
        const returns = match[4].trim();

        const params = {};
        if (paramsString !== '') {
            const paramsArr = paramsString.split(';');
            for (const param of paramsArr) {
                const [paramName, paramType] = param.split(':').map(part => part.trim());
                params[paramName] = paramType;
            }
        }

        const functionObj = {
            summary: summary,
            params: params,
            returns: returns
        };

        json.push(functionObj);
    }

    return json;
}


/* [
    {
        "summary": "GetString",
        "params": {
            "JsonObj": "JsonObject",
            "KeyText": "Text"
        },
        "returns": "Text"
    }
]
 */

async function processLineByLine(filepath) {
    const fileStream = fs.createReadStream(filepath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    var startBlock = '';


    var startStartBlockIndex = -1
    var startEndBlockIndex = -1

    var endStartBlockIndex = -1
    var endEndBlockIndex = -1

    for await (line of rl) {
        lines++
        if (line.includes('///')) {
            line = line.replace('///', '').trim()
            //console.log(`Line from file: ${line}`);

            if (!lastLineDocuComment) {
                comments.push({ rawLines: [line] })
            } else {
                comments[comments.length - 1].rawLines.push(line)
            }
            lastLineDocuComment = true

            //var res = /<.*>/.test(line)
            //var res2 = /<(?!\/>).*?>/.test(line)

            //console.log(line);
            //console.log(res);
            //console.log(res2);


            for (let index = 0; index < line.length; index++) {
                const element = line[index];
                //console.log(element);
                if (element == '<' && line[index + 1] != '/') {
                    startStartBlockIndex = index
                    //console.log('startStartBlockIndex:', startStartBlockIndex);
                }

                if (element == '>' && startStartBlockIndex != -1 && endStartBlockIndex == -1) {
                    startEndBlockIndex = index
                    //console.log('startStartBlockIndex:', startStartBlockIndex);
                    //console.log('startEndBlockIndex:', startEndBlockIndex);
                    //console.log(line.substring(startStartBlockIndex, startEndBlockIndex + 1));
                }

                if (element == '<' && line[index + 1] == '/') {
                    endStartBlockIndex = index
                    console.log('endStartBlockIndex:', endStartBlockIndex);
                }

                if (element == '>' && endStartBlockIndex != -1) {
                    endEndBlockIndex = index
                    console.log('endEndBlockIndex:', endEndBlockIndex);

                    console.log(line.substring(startEndBlockIndex + 1, endStartBlockIndex));

                    startStartBlockIndex = -1
                    startEndBlockIndex = -1
                    endStartBlockIndex = -1
                    endEndBlockIndex = -1
                }


            }


            /* 
                        if (line.startsWith('<') && line.endsWith('>')) {
                            var te = line.startsWith('<')
            
                            startBlock = line.replace('<', '').replace('>', '').trim()
                        }
            
                        if (line.startsWith('</') && line.endsWith('>') && line.includes(startBlock)) {
                            startBlock = ''
                        }
            
                        if (startBlock != '') {
                            if (comments[comments.length - 1][startBlock]) {
                                comments[comments.length - 1][startBlock].push(line)
                            } else {
                                comments[comments.length - 1][startBlock] = []
                            }
                        } */

        } else {
            lastLineDocuComment = false
        }
    }

    //console.log(comments);
    return comments
}


init()
