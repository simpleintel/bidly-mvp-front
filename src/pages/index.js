import React, { useState } from 'react';
import axios from 'axios';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Button, message, Upload, notification, Image, Spin, Table } from 'antd';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const IndexPage = () => {
  const [pdfFile, setPdfFile] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [isPdfView, setIsPdfView] = useState(false);
  const [pdfDisplayList, setPdfDisplayList] = useState(null);
  const [uid, setUid] = useState(null);

  const bucketName = 'bidly-data-new';
  const bucketRegion = 'us-east-1';
  const accessKey = 'AKIAQP4Y5NIN5JARZXPA';
  const secretAccessKey = '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';

  const client = new S3Client({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretAccessKey
    },
    region: bucketRegion
  });

  const props = {
    beforeUpload(file) {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error(`${file.name} is not a PDF file`);
      }
      return isPDF || Upload.LIST_IGNORE;
    },
    async onChange(info) {
      if (uploadInProgress && uid === info.file.uid) {
        return;
      }
      setUploadInProgress(true);
      setIsLoading(true);
      setUid(info.file.uid);

      if (uid !== info.file.uid && info.fileList.length > 0) {
        const formData = new FormData();
        formData.append('pdf_url', info.fileList[0].originFileObj);

        const params = {
          Bucket: bucketName,
          Key: info.fileList[0].originFileObj.name,
          Body: formData,
        };
        const command = new PutObjectCommand(params);

        try {
          const clientSend = await client.send(command);
          if (clientSend) {
            openNotificationWithIcon('success');
            const formDataEndpoint = new FormData();
            formDataEndpoint.append('pdf_url', info.fileList[0].originFileObj.name);
            const detectResponse = await axios.post('http://52.91.53.52:5000/detect', formDataEndpoint, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': 'xxx'
              },
            });
            let fetchResponse
            try {

              if (detectResponse.data.task_id !== null && detectResponse.data.task_id !== '') {
                fetchResponse = await axios.get(`http://52.91.53.52:5000/fetch_result/${detectResponse?.data?.task_id}`);
                // fetchResponse = await axios.get(`http://52.91.53.52:5000/fetch_result/${3}`);

                while (fetchResponse.data.result === null) {
                  await new Promise(resolve => setTimeout(resolve, 5000));
                  fetchResponse = await axios.get(`http://52.91.53.52:5000/fetch_result/${detectResponse?.data?.task_id}`);
                  setPdfFile(fetchResponse.data.result);
                }
              }

              if (fetchResponse.data.result) {
                setPdfFile([fetchResponse.data.result]);
                setIsLoading(false);
                openNotificationWithIcon('success');

              }

            }
            catch {
              openNotificationWithIcon('error');
            }
          }
        } catch (error) {
          console.error('Error:', error);
          openNotificationWithIcon('error');
        }
      }
      setUploadInProgress(false);
    }
  };

  const onRemove = (file) => {
    setFileList(fileList.filter((f) => f !== file));
  };

  const openNotificationWithIcon = (type) => {
    const message = type === 'success' ? 'Successfully Upload' : 'No pdf display data!';
    api[type]({
      message,
      description: '',
    });
  };

  const handlePdflists = (list) => {
    setPdfDisplayList(list);
    setIsPdfView(true);
  };

  const handleReturn = () => {
    setIsPdfView(false);
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image_used',
      key: 'image',
      render: (image) => (
        <Image
          width={200}
          src={image}
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Unit Type',
      dataIndex: ['api_response', 'unit-type'],
      key: 'unit-type',
    },
    {
      title: 'Base Cabinet Linear ft',
      dataIndex: ['api_response', 'base-cabinet-linear-ft'],
      key: 'base-cabinet-linear-ft',
    },
    {
      title: 'Wall Cabinet Linear ft',
      dataIndex: ['api_response', 'wall-cabinet-linear-ft'],
      key: 'wall-cabinet-linear-ft',
    },
  ];

  const pricingColumns = [
    {
      title: 'Unit Number',
      dataIndex: 'unit number',
      key: 'unit number',
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
    },
    {
      title: 'Number of Units',
      dataIndex: 'number_of_units',
      key: 'number_of_units',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
    },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1>Upload PDF File</h1>
        <div style={{ width: '200px', margin: 'auto' }}>
          <Upload {...props} onRemove={onRemove} maxCount={1}>
            <Button disabled={isLoading} icon={<UploadOutlined />}>Upload PDF only</Button>
          </Upload>

          {isLoading && <Spin style={{ marginTop: '24px', marginBottom: '24px' }} size="large" />}
        </div>
      </div>

      {pdfFile?.length > 0 && !isPdfView && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', width: '75%', margin: 'auto' }}>
          {pdfFile[0]?.results.map((page, index) => (
            <div key={index} style={{ margin: '12px' }}>
              <p style={{ color: 'blue', cursor: 'pointer' }} onClick={() => window.open(page.page_urls, '_blank')}>
                Page number: {page.page_number}
              </p>
              <p style={{ color: 'blue', cursor: 'pointer' }} onClick={() => handlePdflists(page)}>
                Kitchen Cabinets: {page.num_cabinet.reduce((total, amount) => total + amount, 0)}
              </p>
              <p style={{ color: 'blue', cursor: 'pointer' }} onClick={() => handlePdflists(page)}>
                Bathroom Cabinets: {page.num_bath_cabinets.reduce((total, amount) => total + amount, 0)}
              </p>
            </div>
          ))}
        </div>
      )}


      {pdfFile?.length > 0 && !isPdfView && (
        <div style={{ width: '90%', margin: 'auto' }}>
          <div>
            <h2 style={{ textAlign: 'center' }}>Unit-Level Measurement</h2>
            <Table
              dataSource={pdfFile[0].openai_response}
              columns={columns}
              pagination={false}
              style={{ marginBottom: '24px' }}
            />
          </div>
          <div>
            <h2 style={{ textAlign: 'center' }}>Calculation</h2>
            <Table
              dataSource={pdfFile[0].pricing_table}
              columns={pricingColumns}
              pagination={false}
              style={{ marginBottom: '24px' }}
            />
          </div>
        </div>
      )}

      {isPdfView && pdfDisplayList && (
        <div style={{ width: '90%', margin: 'auto' }}>
          <ArrowLeftOutlined style={{ fontSize: '36px', cursor: 'pointer' }} onClick={handleReturn} />
          <div>
            <h2 style={{ textAlign: 'center' }}>Elevation section</h2>
            <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {pdfDisplayList.elevation_urls.map((url, i) => (
                <div key={i} style={{ flexBasis: 'calc(33.33% - 12px)', marginBottom: '24px' }}>
                  <div style={{ marginRight: '18px' }}>
                    <Image
                      width={500}
                      src={url}
                      style={{ marginLeft: '16px' }}
                    />
                    <p><span style={{ fontWeight: 'bold' }}>Number of Cabinets:</span> {pdfDisplayList.num_cabinet[i]}</p>
                    <a style={{ display: "table-cell" }} href={pdfDisplayList.page_urls} target="_blank"><p><span style={{ fontWeight: 'bold' }} >Page Number:</span> {pdfDisplayList.page_number}</p></a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 style={{ textAlign: 'center' }}>Bathroom section</h2>
            <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {pdfDisplayList.bath_urls.map((url, index) => (
                <div key={index} style={{ flexBasis: 'calc(33.33% - 12px)', marginBottom: '24px' }}>
                  <div style={{ marginRight: '18px' }}>
                    <Image
                      width={500}
                      src={url}
                      style={{ marginLeft: '16px' }}
                    />
                    <p><span style={{ fontWeight: 'bold' }}>Number of Cabinets:</span> {pdfDisplayList.num_bath_cabinets[index]}</p>
                    <a style={{ display: "table-cell" }} href={pdfDisplayList.page_urls} target="_blank"><p><span style={{ fontWeight: 'bold' }} >Page Number:</span> {pdfDisplayList.page_number}</p></a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );


};

export default IndexPage;