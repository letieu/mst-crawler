## Crawl data from https://tracuunnt.gdt.gov.vn/tcnnt/mstdn.jsp

## Run

**Start**
```bash
docker run --name mst-crawler -e CAP_SOLVER_KEY=xxx -p 3000:3000 letieu/mst-scan:1.0

```

**Trigger**
```
curl -X POST "localhost:3000" \
  --header "Content-Type: application/json" \
  --data '{"taxIds": ["01104816", "0316624"]}'
```

