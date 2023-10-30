import { useState } from "react"
import React from 'react';
import axios from 'axios'
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, message, Upload, notification } from 'antd';
import { Image, Spin } from 'antd';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const IndexPage = () => {
  const [pdfFile, setPdfFile] = useState([])
  const [fileList, setFileList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [api, contextHolder] = notification.useNotification();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [isPdfView, setIsPdfView] = useState(false)
  const [pdfDisplayList, setPdfDisplayList] = useState([])

  const [uid, setUid] = useState(null);

  const bucketName = 'bidly-data'
  const bucketRegion = 'us-east-1'
  const accessKey = 'AKIAZDO4IOGWVVK7DRX4'
  const secretAccessKey = `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`
  const client = new S3Client({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: String(secretAccessKey)
    },
    region: bucketRegion
  });

  const props = {

    beforeUpload(file) {

      const isPNG = file.type === 'application/pdf';
      if (!isPNG) {
        message.error(`${file.name} is not a PDF file`);
      }
      return isPNG || Upload.LIST_IGNORE;
    },
    async onChange(info) {

      if (uploadInProgress && uid === info.file.uid) {
        return;
      }
      setUploadInProgress(true);
      setIsLoading(true)
      setUid(info.file.uid)
      let clientSend;
      if (uid !== info.file.uid && info.fileList.length > 0) {
        const formData = new FormData();
        formData.append('pdf_url', info.fileList[0].originFileObj.name);

        // formData.append('pdf_url', fs.createReadStream(info.fileList[0].originFileObj));
        if (info) {
          const params = {
            Bucket: bucketName,
            Key: info.fileList[0].originFileObj,
            Body: formData,
          };
          const command = new PutObjectCommand(params);
          try {
            clientSend = await client.send(command);
          } catch (error) {
            console.log('error', error)
          }
          if (clientSend) {
            openNotificationWithIcon('success')


            setIsLoading(false);
          } else {
            openNotificationWithIcon('error')

          }
          if (clientSend) {
            const detectResponse = await axios.post('http://34.203.12.157:5000/detect', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': 'xxx'
              },
            })
            let fetchResponse
            if (detectResponse) {
              fetchResponse = await axios.get(`http://34.203.12.157:5000/fetch_result/${detectResponse?.data?.task_id}`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  'Authorization': 'xxx'
                },
              })
              setPdfFile(fetchResponse.data.result);

            }

            if (fetchResponse?.data.result !== null) {

              openNotificationWithIcon('success')
            } else {
              openNotificationWithIcon('error')
            }
          }

        }
      }
    }

  }
 

  const onRemove = (file) => {
    setFileList(fileList.filter((f) => f !== file));
  };

  const openNotificationWithIcon = (type) => {
    let message;
  
    if (type === 'success') {
      message = 'Successfully Upload';
    } else if (type === 'error') {
      message = 'No pdf display data!';
    }
  
    api[type]({
      message,
      description: '',
    });
  };

  const handlePdflists = (list) => {
    setPdfDisplayList(list)
    setIsPdfView(true)

  }

  const handleReturn = () => {
    setIsPdfView(false)

  }
  return (

    <div >

      {contextHolder}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1>
          Upload PDF File
          <br />
        </h1>
        <div style={{ width: '200px', margin: 'auto' }}>

          <Upload  {...props} onRemove={onRemove} maxCount={1}>
            <Button disabled={isLoading} icon={<UploadOutlined />}>Upload PDF only</Button>
          </Upload>

          {isLoading && <Spin style={{ marginTop: '24px', marginBottom: '24px' }} size="large" />}

        </div>
      </div>
      <div style={{ width: '70%', margin: 'auto' }}>

        {isPdfView ? (
          <div>
            <ArrowLeftOutlined style={{ fontSize: '36px', cursor: 'pointer' }} onClick={handleReturn} />
            <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'row', 'justifyContent': 'space-between' }}>
              {pdfDisplayList?.elevation_urls?.map((list, index) => (
                <div key={index} >
                  <div style={{ marginRight: '18px' }}>
                    <Image
                      width={500}
                      src={list}
                      style={{ marginLeft: '16px' }}
                    />
                    <p><span style={{ fontWeight: 'bold' }}>Number of Cabinets:</span> {pdfDisplayList.num_cabinet[index]}</p>
                    <p><span style={{ fontWeight: 'bold' }}>Number of Page:</span> {pdfDisplayList.page_num}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )
          :

          (<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '70%', margin: 'auto' }}>
            {pdfFile?.map((list, index) => (
              <div key={index} style={{ marginBottom: '24px', width: 'calc(50% - 18px)' }}>
                <p style={{ color: 'blue', cursor: 'pointer' }} onClick={() => handlePdflists(list)}>{list.elevation_urls[0]}</p>
              </div>
            ))}
          </div>)
        }
      </div>

    </div>

  )
}

export default IndexPage
