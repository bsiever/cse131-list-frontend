npm run build && aws s3 sync ./build s3://131list-frontend-dev --delete && aws cloudfront create-invalidation --distribution-id ETF838U78JY44 --paths "/*"
