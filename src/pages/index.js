import { useEffect, useState } from "react"
import React from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import axios from 'axios'
import { Image, Alert } from 'antd';


const headingStyles = {
  marginTop: 0,
  marginBottom: 64,
  maxWidth: 320,
}

const IndexPage = () => {
  const [pdfFile, setPdfFile] = useState([])
  const [messageSuccess, setMessageSuccess] = useState(null)

  useEffect(() => {
    axios.get('http://ec2-13-53-130-22.eu-north-1.compute.amazonaws.com:5000/get_image/A-803_-_UNIT_KITCHEN_ELEVATIONS_0.jpg').then((response) => {
      setPdfFile(response.config.url)

      console.log('response', response.config.url);
    }).catch((error) => {
      console.log(error);
    });
  }, [])


  const beforeUpload = (file) => {
    const isPNG = file.type === 'application/pdf';
    if (!isPNG) {
      message.error(`${file.name} is not a PDF file`);
    }
    return isPNG || Upload.LIST_IGNORE;
  }

  const handleUpload = (info) => {
    if (info.fileList.length > 0) {
      const formData = new FormData();
      formData.append('File', info.fileList[0].originFileObj);
      console.log('formData', formData);
      if (info) {
        console.log('formData he;llo', info);

        axios.post('http://ec2-13-53-130-22.eu-north-1.compute.amazonaws.com:5000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'xxx'
          }
        }).then((response) => {
          console.log('response', response.status);
          setMessageSuccess(response.status)
        }).catch((error) => {
          console.log('error', error);
        });
      }
    }
  }

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '70%', margin: 'auto' }}>
      <Image
        width={800}
        src={pdfFile}
      />
      <div>
        <h1 style={headingStyles}>
          Upload PDF File
          {messageSuccess === 200 ? (
            <Alert message="Success PDF Upload" type="success" />
          ) : (
            <Alert message="Error in PDF Upload" type="error" />
          ) }
          <br />
        </h1>
        <Upload beforeUpload={beforeUpload} onChange={handleUpload}>
          <Button icon={<UploadOutlined />}>Upload PDF only</Button>
        </Upload>
      </div>
    </main>
  )
}

export default IndexPage


