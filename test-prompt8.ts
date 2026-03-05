import { Input } from 'jsr:@cliffy/prompt@^1.0.0';
import { colors } from 'jsr:@cliffy/ansi@^1.0.0/colors';

class NoPrefixInput extends Input {
  protected override getPrefix(): string {
    return "";
  }
}

const p = await NoPrefixInput.prompt({
    message: colors.bold('› '),
});
console.log("Got:", p);
