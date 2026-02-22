-- Dev seed for seller/product flow (idempotent by delete+insert for known nm_id values)
-- Uses seller_id = 1 and 2 so frontend can work with VITE_SELLER_ID=1 by default.

BEGIN;

DELETE FROM public.product
WHERE nm_id IN (910001, 910002, 910003, 910004, 910005, 910006);

INSERT INTO public.product (seller_id, nm_id, category_id, category_name, name, image, price, discount)
VALUES
    (1, 910001, 101, 'Спорт и отдых', 'Фитнес-браслет SmartFit Pro', 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400', 3990, 33),
    (1, 910002, 101, 'Спорт и отдых', 'Йога-мат премиум', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400', 2490, 29),
    (1, 910003, 102, 'Электроника', 'Беспроводные наушники AirPods', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400', 8990, 31),
    (1, 910004, 102, 'Электроника', 'Умные часы Galaxy Watch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', 15990, 27),
    (2, 910005, 103, 'Дом и интерьер', 'Органайзер для дома', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400', 1890, 25),
    (2, 910006, 104, 'Мода и стиль', 'Набор украшений', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', 3290, 20);

COMMIT;
