import { Input } from '@workspace/ui/components/input'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { HiddenInput } from "@workspace/ui/components/hidden-input"
import { FieldInfo } from "@workspace/ui/components/field-info"
import { Label } from '@workspace/ui/components/label'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm: useForm } = createFormHook({
  fieldComponents: {
    Input,
    HiddenInput,
    Checkbox
  },
  formComponents: {
    Label,
    Button,
    FieldInfo
  },
  fieldContext,
  formContext
})



export { useForm }