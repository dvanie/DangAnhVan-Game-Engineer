using UnityEngine;

public class PlayerMovement : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;

    private void Update()
    {
        float x = Input.GetAxisRaw("Horizontal");
        float z = Input.GetAxisRaw("Vertical");

        Vector3 moveDirection = new Vector3(x, 0f, z);

        if (moveDirection != Vector3.zero)
            {
             transform.position +=
             moveDirection.normalized *
             moveSpeed *
             Time.deltaTime;

                transform.forward = moveDirection;
            }
    }
}
