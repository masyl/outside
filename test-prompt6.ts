import { Input } from 'jsr:@cliffy/prompt@^1.0.0';
import { colors } from 'jsr:@cliffy/ansi@^1.0.0/colors';

const p = await Input.prompt({
    message: colors.bold('›'),
    prefix: ' ',
});
console.log("Got:", p);
