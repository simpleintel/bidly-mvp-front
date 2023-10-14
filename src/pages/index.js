import { useEffect, useState } from "react"
import React from 'react';
import axios from 'axios'
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload, notification } from 'antd';
import { Image, Spin } from 'antd';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const IndexPage = () => {
  const [pdfFile, setPdfFile] = useState([])
  const [fileList, setFileList] = useState([])
  const [messageSuccess, setMessageSuccess] = useState(null)
  const [displayMessage, setdisplayMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [api, contextHolder] = notification.useNotification();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uid, setUid] = useState(null);


  const bucketName = 'bidly-storage-s3-bucket'
  const bucketRegion = 'eu-north-1'
  const accessKey = 'AKIATQKK2HKFOD4ZEY76'
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
        // Ignore onChange while an upload is already in progress
        return;
      }
      setUploadInProgress(true);
      setIsLoading(true)
      setUid(info.file.uid)

      if (uid !== info.file.uid && info.fileList.length > 0) {
        const formData = new FormData();
        formData.append('file', info.fileList[0].originFileObj);
        if (info) {
          const params = {
            Bucket: bucketName,
            Key: info?.fileList[0].originFileObj.toString(),
            Body: formData,
          };
          const command = new PutObjectCommand(params);
          try {
            const data = await client.send(command);
          } catch (error) {
            console.log('error', error)
          } 

          axios.post('http://ec2-13-53-130-22.eu-north-1.compute.amazonaws.com:5000/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': 'xxx'
            }
          }).then((response) => {
            setMessageSuccess(response.data.issuccess)
            setIsLoading(false)
            setPdfFile(response.data.results)
            setdisplayMessage(response.data.success_message)

          }).catch((error) => {
            setdisplayMessage(error)
            setMessageSuccess(false)
            setIsLoading(false)
            // setFileList(info?.fileList.filter((file) => file !== info.fileList[0]));
            // props.beforeUpload(info?.fileList[0]);
          });
        }
      }
    }

  }

  useEffect(() => {
    if (messageSuccess === true) {
      openNotificationWithIcon('success')
    }
    if (messageSuccess === false) {
      openNotificationWithIcon('error')

    }

  }, [pdfFile])

  const onRemove = (file) => {
    setFileList(fileList.filter((f) => f !== file));
  };

  const openNotificationWithIcon = (type) => {
    api[type]({
      message: displayMessage,
      description:
        '',
    });
  };
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '70%', margin: 'auto', }} >

        {pdfFile.map((list, index) => (
          <div key={index} style={{ flexDirection: 'column', marginBottom: '24px' }}>

            <Image
              width={500}
              src={list.kitchen_url}
              style={{ marginLeft: '16px' }}
            />

            <Image
              width={500}
              src={list.cabinet_urls}
            />

            <p><span style={{ fontWeight: 'bold' }}>Number of Cabinets:</span> {list.num_cabinets}</p>
          </div>
        ))}

      </div>
    </div>

  )
}

export default IndexPage
