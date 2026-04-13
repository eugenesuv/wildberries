-- +goose Up
-- +goose StatementBegin
DELETE FROM public.product
WHERE nm_id IN (910007, 910008, 910009);

INSERT INTO public.product (seller_id, nm_id, category_id, category_name, name, image, price, discount)
VALUES
    (1, 910007, 105, 'Здоровье', 'Тонометр GoodMed', 'https://m.media-amazon.com/images/I/71TsULC-+xL._AC_SX500_SY500_.jpg', 5990, 10),
    (1, 910008, 106, 'Красота', 'Крем для лица KREMFARMA', 'https://i.ebayimg.com/images/g/IfUAAOSwkxdmI~9U/s-l1600.jpg', 1399, 9),
    (1, 910009, 107, 'Книги', 'Магические приключения', 'https://avatars.mds.yandex.net/i?id=868391e4b9541a03d5b146b14b079b20_l-5150736-images-thumbs&n=13', 999, 5);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM public.product
WHERE nm_id IN (910007, 910008, 910009);
-- +goose StatementEnd
