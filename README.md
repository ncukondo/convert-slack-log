# Convert slack log to csv

This is a web and cli tool to convert slack log(exported as zip file) to csv.

## usage

### web

https://ncukondo-convert-slack-log.deno.dev/

### cli

#### Install cli

1. Install Deno ( https://deno.land/#installation ).
1. Install cli

```bash
deno install --allow-read --allow-write --import-map=import_map.json -n convert-slack-log https://github.com/ncukondo/convert-slack-log/raw/main/cli.ts
```

#### use cli

```bash
convert-slack-log exported-slack-log.zip
```
