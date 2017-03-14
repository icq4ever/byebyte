var fs = require( 'fs' );
var path = require('path');
var util = require('../util');
var shuffle = require('shuffle-array')

/**
 * Shuffle - works by taking the file and splitting it into various chunks.
 *
 * Chunks can have a specific length randomly determined by range
 * The chunks are then sorted according to 
 */

module.exports = {
    command: 'shuffle',
    desc: 'reorder the data in the file',
    builder: function (yargs) {
        var options = {
            'chunk-min': {
                describe: 'the minimum size a shuffled chunk may be',
                type: 'number'
            },
            'chunk-max': {
                describe: 'the maximum size a shuffled chunk may be',
                type: 'number'
            }
        };

        return yargs.options(options)
            .usage([
                'Shuffle builds a new file with the contents of the file shuffled into random chunks with ',
                'each chunk being a random size between the specified --chunk-min and --chunk-max.'
            ].join(''))
            .example('$0 shuffle --chunk-min 40 --chunk-max 1000 --min 0.3 --max 0.8 --input file.jpg --output file_byebyte.jpg');
    },
    handler: function (argv) {
        var filepath = argv.i || argv.input;
        var out = argv.o || argv.output;
        var fileBuffer = fs.readFileSync( path.resolve( process.cwd(), filepath ) );
        var len = fileBuffer.length;
        var startStop = util.determineModificationRange(argv, len);
        var start = startStop.start;
        var stop = startStop.stop;
        console.log( "File length: " + len );
        console.log( "Randomly shuffling chunks between " + start + " and " + stop);

        var chunkBuf = fileBuffer.slice(start, stop);
        var chunkBufLen = chunkBuf.length;
        var chunks = [];

        var index = 0;
        while (index < chunkBufLen) {
            var bufLeft = chunkBufLen - index;
            var chunkSize = util.getRandomInt(argv['chunk-min'], argv['chunk-max']);
            if (chunkSize > bufLeft) {
                chunkSize = bufLeft;
            }

            var chunk = chunkBuf.slice(index, index + chunkSize);
            chunks.push(chunk);

            index += chunkSize;
        }

        var buf = Buffer.alloc(0);
        if (start > 0) {
            buf = Buffer.concat([buf, fileBuffer.slice(0, start)]);
        }

        shuffle(chunks);

        chunks.forEach(function (chunk) {
            buf = Buffer.concat([buf, chunk]);
        });

        if (stop < len) {
            buf = Buffer.concat([buf, fileBuffer.slice(stop, len)]);
        }

        fs.writeFileSync( path.resolve( process.cwd(), out ), buf );
        console.log('Replaced byte(s) with trash and exported to ' + out + '.');
    }
};