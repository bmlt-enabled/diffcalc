# diffcalc

### How to export keys and then restore
_Export_+
```shell
redis-cli dump nynl22:dates | perl -pe 'chomp if eof' > mykey.dump
```

_Import_
```shell
redis-cli -x restore nynl22:dates 0 < ~/Desktop/mykey.dump
```
