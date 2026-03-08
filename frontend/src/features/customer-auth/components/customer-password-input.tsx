import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Input, type InputProps } from '@/components/ui'

type CustomerPasswordInputProps = Omit<InputProps, 'type' | 'rightAddon'>

export function CustomerPasswordInput(props: CustomerPasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <Input
      {...props}
      type={isVisible ? 'text' : 'password'}
      rightAddon={
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          className="rounded p-0.5 text-app-muted transition-colors hover:text-app-text"
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  )
}
