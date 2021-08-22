npm run build && aws s3 sync ./build s3://131list-frontend-prod --delete && aws cloudfront create-invalidation --distribution-id E1AREBJ4HPX8IA --paths "/*"
