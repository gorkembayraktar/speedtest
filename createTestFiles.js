const fs = require('fs');

function createRandomFile(sizeInMB, filename) {
    const sizeInBytes = sizeInMB * 1024 * 1024;
    const buffer = Buffer.alloc(sizeInBytes);
    
    // Fill buffer with random data
    for (let i = 0; i < sizeInBytes; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
    }
    
    fs.writeFileSync(filename, buffer);
    console.log(`Created ${filename} (${sizeInMB}MB)`);
}

// Create test files
createRandomFile(1, 'test_1mb.bin');
createRandomFile(5, 'test_5mb.bin');
createRandomFile(10, 'test_10mb.bin');
createRandomFile(25, 'test_25mb.bin'); 