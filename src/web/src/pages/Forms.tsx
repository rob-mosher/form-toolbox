import axios from 'axios'
import { toast } from 'react-toastify'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header, Icon, Table } from 'semantic-ui-react'

import ModalDeleteForm from '../modals/ModalDeleteForm'

import type { Form, FormsList } from '../types'

export default function Forms() {
  const [forms, setForms] = useState<FormsList[]>([])
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState<Form['id'] | null>(null)

  const url = `//${import.meta.env.VITE_API_HOST || '127.0.0.1'}:${import.meta.env.VITE_API_PORT || 3000}/api/forms`

  const loadForms = useCallback(() => {
    axios.get(url)
      .then((resp) => {
        setForms(resp.data)
      })
      .catch((error) => {
        toast.error('Error: Unable to load forms.', {
          autoClose: 5000,
        })
        console.error('Unable to load forms:', error)
      })
  }, [url])

  const handleDelete = (formId: Form['id'] | null) => {
    if (formId === null) {
      console.warn('Attempted to delete a form with a null ID. No action will be taken.')
      return
    }

    axios.delete(`${url}/${formId}`)
      .then(() => {
        toast.success('Form deleted successfully')
        setIsModalDeleteOpen(false)
        loadForms()
      })
      .catch((error) => {
        toast.error('Error: Unable to delete form.')
        console.error('Unable to delete form:', error)
      })
  }

  useEffect(() => {
    loadForms()
  }, [loadForms])

  return (
    <>
      <Header as='h2'>Forms</Header>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Action</Table.HeaderCell>
            <Table.HeaderCell>File Name</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Pages</Table.HeaderCell>
            <Table.HeaderCell>Type</Table.HeaderCell>
            <Table.HeaderCell>Form ID</Table.HeaderCell>
            <Table.HeaderCell>Textract Job ID</Table.HeaderCell>
            <Table.HeaderCell>Uploaded At</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {forms.map((form) => (
            <Table.Row key={form.id}>
              <Table.Cell singleLine>
                <Link to={`/forms/${form.id}/edit`}>
                  <Icon color='grey' name='edit' />
                </Link>
                <Link to={`/forms/${form.id}`}>
                  <Icon color='grey' name='eye' />
                </Link>
                <Icon
                  color='grey'
                  name='delete'
                  onClick={() => {
                    setSelectedFormId(form.id)
                    setIsModalDeleteOpen(true)
                  }}
                />
              </Table.Cell>
              <Table.Cell>{form.fileName}</Table.Cell>
              <Table.Cell>{form.status}</Table.Cell>
              <Table.Cell>{form.pageCount}</Table.Cell>
              <Table.Cell>{form.formType?.name}</Table.Cell>
              <Table.Cell>{form.id}</Table.Cell>
              <Table.Cell>{form.textractJobId}</Table.Cell>
              <Table.Cell>{new Date(form.createdAt).toLocaleString()}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <ModalDeleteForm
        handleDelete={handleDelete}
        isModalDeleteOpen={isModalDeleteOpen}
        selectedFormId={selectedFormId}
        setIsModalDeleteOpen={setIsModalDeleteOpen}
      />
    </>
  )
}
