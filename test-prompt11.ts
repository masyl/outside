import { Input } from 'jsr:@cliffy/prompt@^1.0.0';
const suggestion = "help [h]";
const cleanSuggestion = suggestion.replace(/\s\[[a-z]\]$/, '');
console.log("Stripped:", cleanSuggestion);
