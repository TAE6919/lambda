const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {
  const Bucket = event.Records[0].s3.bucket.name;

  const Key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );
  const filename = Key.split('/')[Key.split('/').length - 1];
  const ext = Key.split('.')[Key.split('.').length - 1];
  const requiredFormat = ext === 'jpg' ? 'jpeg' : ext; // sharp에서는 jpg 대신 jpeg 사용합니다.

  const [folder] = Key.split('/');

  try {
    const s3Object = await s3.getObject({ Bucket, Key }).promise(); // 버퍼로 가져오기

    let resizedImage;
    if (folder == 'formLink') {
      console.log('formLink 리사이징');
      resizedImage = await sharp(s3Object.Body) // 리사이징
        .resize(400)
        .toFormat(requiredFormat)
        .withMetadata()
        .toBuffer();
    } else {
      console.log('이미지 리사이징');
      resizedImage = await sharp(s3Object.Body) // 리사이징
        .resize(200)
        .toFormat(requiredFormat)
        .withMetadata()
        .toBuffer();
    }

    await s3
      .putObject({
        // thumb 폴더에 저장
        Bucket,
        Key: `thumb/${filename}`,
        Body: resizedImage,
      })
      .promise();

    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
