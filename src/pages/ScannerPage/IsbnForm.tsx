import { useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Import } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast.ts';
import { useAppDispatch, useAppSelector } from '@/store/hooks.ts';
import { enqueueScan, selectScanResultList } from '@/store/scannerSlice.ts';
import { getIsbn13 } from '@/utils/primitive.ts';
import { checkIsbnCode } from '@/utils/validate.ts';

const FormSchema = z
  .object({
    isbn: z.string(),
  })
  .refine(data => checkIsbnCode(data.isbn), {
    message: 'ISBNコードじゃない',
    path: ['isbn'],
  });

export default function IsbnForm() {
  const dispatch = useAppDispatch();
  const scanResultList = useAppSelector(selectScanResultList);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      isbn: '',
    },
    mode: 'onChange',
  });

  const onSubmit = useCallback(
    (data: z.infer<typeof FormSchema>) => {
      const maybeIsbn = data.isbn.replaceAll('-', '');

      if (!checkIsbnCode(maybeIsbn)) return;

      form.setValue('isbn', '');

      const isbn13 = getIsbn13(maybeIsbn);

      // 既に存在する場合はスキップ
      if (scanResultList.some(sr => sr.isbn === isbn13)) {
        toast({
          title: 'You submitted the following values',
          description: (
            <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
              <code className="text-white">{JSON.stringify(data, null, 2)}</code>
            </pre>
          ),
        });
        return;
      }

      dispatch(enqueueScan({ list: [isbn13], type: 'new' }));
    },
    [dispatch, form, scanResultList, toast]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="bg-background rounded-xl p-3 flex items-center gap-3">
        <FormField
          control={form.control}
          name="isbn"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0 flex-1">
              <FormLabel>ISBN</FormLabel>
              <div className="flex flex-col flex-1">
                <FormControl>
                  <Input placeholder="ISBN" {...field} className="flex-1" />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button size="sm" type="submit">
          <Import />
          読み込む
        </Button>
      </form>
    </Form>
  );
}
