import * as React from 'react'
import { 
  type BaseError,
  useWaitForTransactionReceipt, 
  useWriteContract 
} from 'wagmi'
import  abi  from '../abi/TimeMachine.json'

export function CreateCharacter() {
  const { 
    data: hash,
    error,
    isPending, 
    writeContract 
  } = useWriteContract() 

  async function submit(e: React.FormEvent<HTMLFormElement>) { 
    e.preventDefault() 
    const formData = new FormData(e.target as HTMLFormElement) 
    // Obtiene los valores de affinity y velocity desde el formulario
    const affinity = formData.get('affinity') as string 
    const velocity = formData.get('velocity') as string 
    writeContract({
      address: '0x6A04F6C5dbd2eb417aEF84982a76509BEB5ec85d',
      abi,
      functionName: 'createCharacter',
      args: [BigInt(affinity), BigInt(velocity)],
    })
  } 

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    }) 

  return (
    <form onSubmit={submit}>
      <input name="affinity" placeholder="Affinity (ej. 100)" required />
      <input name="velocity" placeholder="Velocity (ej. 50)" required />
      <button 
        disabled={isPending} 
        type="submit"
      >
        {isPending ? 'Confirmando...' : 'Crear Personaje'} 
      </button>
      {hash && <div>Hash de la transacción: {hash}</div>}
      {isConfirming && <div>Esperando confirmación...</div>} 
      {isConfirmed && <div>Transacción confirmada.</div>} 
      {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )}
    </form>
  )
}
