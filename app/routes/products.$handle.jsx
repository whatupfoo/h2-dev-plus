import {useLoaderData} from '@remix-run/react';
import {json} from '@shopify/remix-oxygen';
import {Image, Money, ShopPayButton} from '@shopify/hydrogen-react';
import {CartForm} from '@shopify/hydrogen';
import ProductOptions from '~/components/ProductOptions';

export async function loader({params, context, request}) {
  const {handle} = params;
  const searchParams = new URL(request.url).searchParams;
  const selectedOptions = [];

  // Set selected options from the query string
  searchParams.forEach((value, name) => {
    selectedOptions.push({name, value});
  });

  console.log(JSON.stringify(selectedOptions, null, 2));

  const {shop, product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {
      handle,
      selectedOptions,
    },
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // Set a default variant so you always have an "orderable" product selected
  const selectedVariant = product.selectedVariant ?? product?.variants?.nodes[0];

  return json({
    shop,
    product,
    selectedVariant,
  });
}

export default function ProductHandle() {
  const {shop, product, selectedVariant} = useLoaderData();

  // Extract metafields safely
  const metafields = product?.metafields || [];

  // Find specific metafields safely
  const additionalFeatures = metafields.find(mf => mf?.key === 'additional_features');
  const manufacturerInfo = metafields.find(mf => mf?.key === 'manufacturer_info');

  return (
    <section className="w-full gap-4 md:gap-8 grid px-6 md:px-8 lg:px-12">
      <div className="grid items-start gap-6 lg:gap-20 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid md:grid-flow-row  md:p-0 md:overflow-x-hidden md:grid-cols-2 md:w-full lg:col-span-2">
          <div className="md:col-span-2 snap-center card-image aspect-square md:w-full w-[80vw] shadow rounded">
            <h2>
              <Image
                className={`w-full h-full aspect-square object-cover`}
                data={product.selectedVariant?.image || product.featuredImage}
              />
            </h2>
          </div>
        </div>
        <div className="md:sticky md:mx-auto max-w-xl md:max-w-[24rem] grid gap-2 p-0 md:p-6 md:px-0 top-[6rem] lg:top-[8rem] xl:top-[10rem]">
          <div className="grid gap-2">
            <h1 className="text-4xl font-bold leading-10 whitespace-normal">
              {product.title}
            </h1>
            <span className="max-w-prose whitespace-pre-wrap inherit text-copy opacity-50 font-medium">
              {product.vendor}
            </span>
          </div>
          <ProductOptions
            options={product.options}
            selectedVariant={selectedVariant}
          />
          <Money
            withoutTrailingZeros
            data={selectedVariant.price}
            className="text-xl font-semibold mb-2"
          />
          {selectedVariant.availableForSale && (
            <ShopPayButton
              storeDomain={shop.primaryDomain.url}
              variantIds={[selectedVariant?.id]}
              width={'400px'}
            />
          )}
          <CartForm
            route="/cart"
            inputs={{
              lines: [
                {
                  merchandiseId: selectedVariant.id,
                },
              ],
            }}
            action={CartForm.ACTIONS.LinesAdd}
          >
            {(fetcher) => (
              <>
                <button
                  type="submit"
                  onClick={() => {
                    window.location.href = window.location.href + '#cart-aside';
                  }}
                  disabled={
                    !selectedVariant.availableForSale ||
                    fetcher.state !== 'idle'
                  }
                  className="border border-black rounded-sm w-full px-4 py-2 text-white bg-black uppercase hover:bg-white hover:text-black transition-colors duration-150"
                >
                  {selectedVariant?.availableForSale
                    ? 'Add to cart'
                    : 'Sold out'}
                </button>
              </>
            )}
          </CartForm>
          <div
            className="prose border-t border-gray-200 pt-6 text-black text-md"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          ></div>
          {additionalFeatures && (
            <div className="prose border-t border-gray-200 pt-6 text-black text-md">
              <h3>Additional Features</h3>
              <p>{additionalFeatures.value}</p>
            </div>
          )}

          {manufacturerInfo && manufacturerInfo.reference && (
            <div className="prose border-t border-gray-200 pt-6 text-black text-md">
              <h3>Manufacturer Info</h3>
              <p><strong>Name:</strong> {manufacturerInfo.reference.fields.find(field => field?.key === 'name')?.value}</p>
              <p><strong>Description:</strong> {manufacturerInfo.reference.fields.find(field => field?.key === 'description')?.value}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    shop {
      primaryDomain {
        url
      }
    }
    product(handle: $handle) {
      id
      title
      handle
      vendor
      description
      descriptionHtml
      metafields(
        identifiers: [
          { key: "additional_features", namespace: "furniture" }
          { key: "manufacturer_info", namespace: "furniture" }
        ]
      ) {
        key
        value
        type
        reference {
          ... on Metaobject {
            id
            handle
            fields {
              key
              value
              type
            }
          }
        }
      }
      featuredImage {
        id
        url
        altText
        width
        height
      }
      options {
        name
        optionValues {
          name
        }
      }
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;