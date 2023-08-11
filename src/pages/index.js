import { useEffect, useState } from "react"
import React from 'react';
import axios from 'axios'
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload, notification } from 'antd';
import { Image, Spin } from 'antd';

const IndexPage = () => {
  const [pdfFile, setPdfFile] = useState([])
  const [fileList, setFileList] = useState([])
  const [messageSuccess, setMessageSuccess] = useState(null)
  const [displayMessage, setdisplayMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [api, contextHolder] = notification.useNotification();
  const [uploadInProgress, setUploadInProgress] = useState(false);

  const props = {

    beforeUpload(file) {

      const isPNG = file.type === 'application/pdf';
      if (!isPNG) {
        message.error(`${file.name} is not a PDF file`);
      }
      return isPNG || Upload.LIST_IGNORE;
    },
    onChange(info) {
      if (uploadInProgress) {
        // Ignore onChange while an upload is already in progress
        return;
      }

      setUploadInProgress(true);
      setIsLoading(true)

      if (!uploadInProgress && info.fileList.length > 0) {
        const formData = new FormData();
        formData.append('file', info.fileList[0].originFileObj);
        if (info) {

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
            console.log('error', error)
            setdisplayMessage(response.data.error_message)
            setMessageSuccess(false)
            setIsLoading(false)
            setFileList(info.fileList.filter((file) => file !== info.fileList[0]));
            props.beforeUpload(info.fileList[0]);
          });
        }
      }
    }

  }

  useEffect(() => {
    if (messageSuccess) {
      openNotificationWithIcon('success')
    }
    if (messageSuccess === false) {
      openNotificationWithIcon('error')

    }

  }, [messageSuccess])

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

          {isLoading && <Spin style={{ marginTop: '24px' }} size="large" />}

        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '70%', margin: 'auto' }} >

        {pdfFile.map((list, index) => (
          <Image
            key={index}
            width={500}
            src={list}
          />
        ))}

      </div>
    </div>

  )
}

export default IndexPage
