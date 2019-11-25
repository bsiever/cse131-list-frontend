npm run build
aws s3 sync ./build s3://cse131helplist-prototype --delete
aws cloudfront create-invalidation --distribution-id E98FT2IZDP0B2 --paths "/*"
