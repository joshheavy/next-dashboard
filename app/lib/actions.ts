'use server';
import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require'});

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true});
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    
    const { customerId, amount, status } = CreateInvoice.parse({
      customerId: formData.get('customerId'), 
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
    const amountCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try{

      await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountCents}, ${status}, ${date})
      `;
    } catch (error) {
      // We'll log the error to the console for now but later we can use toast
      console.error(error);
    }
    //updating the data and clear this cache and trigger a new request to the server.
    revalidatePath('/dashboard/invoices');
    // redirect the user to the back to the /dashboard/invoices
    redirect('/dashboard/invoices');
    // you can show a toast here also instead of return a message.
    return { message: 'Invoice created successfully' };
}


export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;

  try {

    await sql `
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id};
    `;
  } catch (error) {
    // We'll log the error to the console for now but later we can use toast
    console.error(error);
  }
  // clear the client cache and make a new server request
  revalidatePath('/dashboard/invoices');
  // Redirect the user to the invoice's page
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error("Failed to Delete Invoice");
  await sql`
    DELETE FROM invoices WHERE id = ${id}
  `;
  // clear the client cache and make a new server request
  revalidatePath('/dashboard/invoices');
}