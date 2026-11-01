EXCHANGE DZ - Customer order tracking

1) In Supabase, open SQL Editor.
2) Open SUPABASE_TRACKING_SETUP.sql from this ZIP, copy its full contents, and run it.
3) Upload/replace index.html in your GitHub project. Keep vercel.json unchanged.
4) Wait for Vercel deployment to finish.
5) On the website, customers enter their reference in "تتبّع حالة طلبك".

Privacy: the tracking function returns only reference, operation, USDT amount,
status and creation date. It does not return email, customer identifier, proof path,
or uploaded proof image. A reference should be treated as private by the customer.

This is a status lookup only. It does not verify payment automatically.
