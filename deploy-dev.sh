npm run build && aws s3 sync ./build s3://virtuallists-frontend-dev --delete && aws cloudfront create-invalidation --distribution-id E3137DBO38YK63 --paths "/*"
