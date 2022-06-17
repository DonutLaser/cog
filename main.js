function main() {
    for (let it = 0; it < 100; it++) {
        if (it < 2) {
            console.log(it);
        } else if (it > 2 && it < 4) {
            continue
        }
        if (it > 6) {
            console.log('ready to break');
            break;
        }
    }
}

main();